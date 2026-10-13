import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const hasValidCredentials = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your_supabase') &&
  !supabaseAnonKey.includes('your_supabase') &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

export const isSupabaseConfigured = hasValidCredentials;

interface LocalQueryResult {
  data: any;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

class LocalQuery implements PromiseLike<LocalQueryResult> {
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private filters: Array<{ column: string; value: unknown }> = [];
  private ordering: { column: string; ascending: boolean } | null = null;
  private maxRows: number | null = null;
  private singleRow = false;
  private headOnly = false;
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private resultPromise: Promise<LocalQueryResult> | null = null;

  constructor(private readonly table: string) {}

  select(_columns = '*', options?: { count?: string; head?: boolean }) {
    this.headOnly = Boolean(options?.head);
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.ordering = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.maxRows = count;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.operation = 'insert';
    this.payload = values;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.operation = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  then<TResult1 = LocalQueryResult, TResult2 = never>(
    onfulfilled?: ((value: LocalQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    this.resultPromise ??= this.execute();
    return this.resultPromise.then(onfulfilled, onrejected);
  }

  private readRows(): Record<string, unknown>[] {
    const storedRows = localStorage.getItem(`supabase-local:${this.table}`);
    return storedRows ? JSON.parse(storedRows) as Record<string, unknown>[] : [];
  }

  private writeRows(rows: Record<string, unknown>[]) {
    localStorage.setItem(`supabase-local:${this.table}`, JSON.stringify(rows));
  }

  private matches(row: Record<string, unknown>) {
    return this.filters.every(({ column, value }) => row[column] === value);
  }

  private async execute(): Promise<LocalQueryResult> {
    try {
      let rows = this.readRows();

      if (this.operation === 'insert') {
        const newRows: Record<string, unknown>[] = (Array.isArray(this.payload) ? this.payload : [this.payload])
          .filter((row): row is Record<string, unknown> => row !== null)
          .map((row): Record<string, unknown> => ({
            id: row.id ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
            ...row,
          }));
        const hasDuplicate = newRows.some((newRow) =>
          rows.some((row) =>
            (newRow.blog_slug !== undefined && row.blog_slug === newRow.blog_slug &&
              newRow.user_id !== undefined && row.user_id === newRow.user_id) ||
            (newRow.photo_id !== undefined && row.photo_id === newRow.photo_id &&
              newRow.user_id !== undefined && row.user_id === newRow.user_id)
          )
        );
        if (hasDuplicate) {
          return { data: null, error: { message: 'Duplicate reaction', code: '23505' } };
        }
        rows = [...rows, ...newRows];
        this.writeRows(rows);
        const inserted = newRows.filter((row) => this.matches(row));
        return { data: this.singleRow ? inserted[0] ?? null : inserted, error: null };
      }

      if (this.operation === 'update') {
        const updatedRows = rows.map((row) =>
          this.matches(row) ? { ...row, ...this.payload } : row
        );
        this.writeRows(updatedRows);
        const updated = updatedRows.filter((row) => this.matches(row));
        return { data: this.singleRow ? updated[0] ?? null : updated, error: null };
      }

      if (this.operation === 'delete') {
        const deleted = rows.filter((row) => this.matches(row));
        this.writeRows(rows.filter((row) => !this.matches(row)));
        return { data: deleted, error: null };
      }

      rows = rows.filter((row) => this.matches(row));
      const count = rows.length;
      if (this.ordering) {
        const { column, ascending } = this.ordering;
        rows = [...rows].sort((left, right) => {
          const a = String(left[column] ?? '');
          const b = String(right[column] ?? '');
          return (a < b ? -1 : a > b ? 1 : 0) * (ascending ? 1 : -1);
        });
      }
      if (this.maxRows !== null) rows = rows.slice(0, this.maxRows);
      if (this.headOnly) return { data: null, error: null, count };
      if (this.singleRow) {
        return rows.length === 1
          ? { data: rows[0], error: null, count }
          : { data: null, error: { message: 'No rows found', code: 'PGRST116' }, count };
      }
      return { data: rows, error: null, count };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Local storage query failed' },
      };
    }
  }
}

const createLocalSupabase = () => {
  const localChannel = {
    on() {
      return this;
    },
    subscribe() {
      return this;
    },
  };

  return {
    from: (table: string) => new LocalQuery(table),
    channel: () => localChannel,
    removeChannel: () => Promise.resolve('ok'),
  };
};

let supabase: any;

if (hasValidCredentials) {
  console.info('Using Supabase database mode');
  supabase = createClient(supabaseUrl, supabaseAnonKey);

  supabase.from('comments').select('count').limit(1).then(({ error }: { error: any }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.info('Supabase connection successful');
    }
  });
} else {
  console.warn('Supabase credentials are missing or invalid. Using localStorage mode.');
  supabase = createLocalSupabase();
}

export { supabase };


export interface Comment {
  id: string;
  blog_slug: string;
  author: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes: number;
  liked_by: string[];
  parent_id?: string;
  replies?: Comment[];
}


export const commentService = {

  async getComments(blogSlug: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('blog_slug', blogSlug)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },


  async addComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'likes' | 'liked_by'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        ...comment,
        likes: 0,
        liked_by: []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },


  async toggleLike(commentId: string, userId: string): Promise<Comment> {

    const { data: currentComment, error: fetchError } = await supabase
      .from('comments')
      .select('liked_by, likes')
      .eq('id', commentId)
      .single();

    if (fetchError) throw fetchError;

    const isLiked = currentComment.liked_by.includes(userId);
    const newLikedBy = isLiked
      ? currentComment.liked_by.filter((id: string) => id !== userId)
      : [...currentComment.liked_by, userId];

    const newLikes = isLiked ? currentComment.likes - 1 : currentComment.likes + 1;

    const { data, error } = await supabase
      .from('comments')
      .update({
        liked_by: newLikedBy,
        likes: newLikes
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },


  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  },


  async getBlogLovesCount(blogSlug: string): Promise<number> {
    const { count, error } = await supabase
      .from('blog_loves')
      .select('*', { count: 'exact', head: true })
      .eq('blog_slug', blogSlug);

    if (error) throw error;
    return count || 0;
  },


  async hasUserLovedBlog(blogSlug: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blog_loves')
      .select('id')
      .eq('blog_slug', blogSlug)
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  },


  async loveBlogPost(blogSlug: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_loves')
      .insert({
        blog_slug: blogSlug,
        user_id: userId
      })
      .select();

    if (error) {

      if (error.code !== '23505') {
        throw error;
      }
    }
  },


  async getBlogLikesCount(blogSlug: string): Promise<number> {
    const { count, error } = await supabase
      .from('blog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('blog_slug', blogSlug);

    if (error) throw error;
    return count || 0;
  },


  async hasUserLikedBlog(blogSlug: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('blog_slug', blogSlug)
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  },


  async likeBlogPost(blogSlug: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_likes')
      .insert({
        blog_slug: blogSlug,
        user_id: userId
      })
      .select();

    if (error) {

      if (error.code !== '23505') {
        throw error;
      }
    }
  },

  // Photo loves functions
  async getPhotoLovesCount(photoId: number): Promise<number> {
    const { count, error } = await supabase
      .from('photo_loves')
      .select('*', { count: 'exact', head: true })
      .eq('photo_id', photoId);

    if (error) throw error;
    return count || 0;
  },

  async getAllPhotoLovesCounts(): Promise<Record<number, number>> {
    const { data, error } = await supabase
      .from('photo_loves')
      .select('photo_id');

    if (error) throw error;

    // Count occurrences of each photo_id
    const counts: Record<number, number> = {};
    data?.forEach((item: { photo_id: number }) => {
      counts[item.photo_id] = (counts[item.photo_id] || 0) + 1;
    });

    return counts;
  },

  async hasUserLovedPhoto(photoId: number, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('photo_loves')
      .select('id')
      .eq('photo_id', photoId)
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  },

  async lovePhoto(photoId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('photo_loves')
      .insert({
        photo_id: photoId,
        user_id: userId
      })
      .select();

    if (error) {
      if (error.code !== '23505') { // 23505 is unique constraint violation
        throw error;
      }
    }
  },

  async unlikePhoto(photoId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('photo_loves')
      .delete()
      .eq('photo_id', photoId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Get blog post view count
  async getBlogViews(blogSlug: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('blog_views')
        .select('view_count')
        .eq('blog_slug', blogSlug)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data?.view_count || 0;
    } catch (error) {
      console.warn('Error fetching blog views:', error);
      return 0;
    }
  },

  // Increment blog post view count
  async incrementBlogViews(blogSlug: string): Promise<void> {
    try {
      // First, try to get existing view count
      const { data: existingData, error: fetchError } = await supabase
        .from('blog_views')
        .select('view_count')
        .eq('blog_slug', blogSlug)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('blog_views')
          .update({
            view_count: existingData.view_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('blog_slug', blogSlug);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('blog_views')
          .insert({
            blog_slug: blogSlug,
            view_count: 1
          });

        if (error) throw error;
      }
    } catch (error) {
      console.warn('Error incrementing blog views:', error);
      // Don't throw error to avoid breaking the page load
    }
  },

};
