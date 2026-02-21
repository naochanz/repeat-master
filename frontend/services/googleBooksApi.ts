import axios from 'axios';

export interface BookInfo {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  thumbnail?: string;
  isbn: string;
}

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const OPENBD_API_URL = 'https://api.openbd.jp/v1/get';

/**
 * openBD APIから本の情報を取得（日本語書籍に強い）
 */
async function getBookFromOpenBD(cleanIsbn: string): Promise<BookInfo | null> {
  try {
    const response = await axios.get(OPENBD_API_URL, {
      params: { isbn: cleanIsbn },
    });

    const data = response.data;
    if (!data || !data[0]) {
      return null;
    }

    const book = data[0];
    const summary = book.summary;
    if (!summary) {
      return null;
    }

    return {
      title: summary.title || '',
      authors: summary.author ? summary.author.split(/[,、／]/).map((a: string) => a.trim()).filter(Boolean) : undefined,
      publisher: summary.publisher || undefined,
      publishedDate: summary.pubdate || undefined,
      thumbnail: summary.cover || undefined,
      isbn: cleanIsbn,
    };
  } catch (error) {
    console.error('Failed to fetch book info from openBD:', error);
    return null;
  }
}

/**
 * Google Books APIから本の情報を取得
 * @returns BookInfo | null（成功/該当なし）
 * @throws 429レート制限時はthrowしてフォールバックさせる
 */
async function getBookFromGoogle(cleanIsbn: string): Promise<BookInfo | null> {
  const params: Record<string, string> = { q: `isbn:${cleanIsbn}` };
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
  if (apiKey) {
    params.key = apiKey;
  }

  const response = await axios.get(GOOGLE_BOOKS_API_URL, { params });

  if (response.data.totalItems === 0 || !response.data.items?.length) {
    return null;
  }

  const book = response.data.items[0].volumeInfo;

  return {
    title: book.title || '',
    authors: book.authors,
    publisher: book.publisher,
    publishedDate: book.publishedDate,
    description: book.description,
    thumbnail: book.imageLinks?.thumbnail?.replace('http://', 'https://'),
    isbn: cleanIsbn,
  };
}

export const googleBooksApi = {
  /**
   * ISBNから本の情報を取得
   * Google Books → openBD の順で検索し、見つかった方を返す
   */
  async getBookByISBN(isbn: string): Promise<BookInfo | null> {
    const cleanIsbn = isbn.replace(/-/g, '');

    // まずGoogle Booksで検索（サムネイル情報が充実）
    try {
      const googleResult = await getBookFromGoogle(cleanIsbn);
      if (googleResult) {
        return googleResult;
      }
    } catch (error) {
      // 429等のエラー時はopenBDにフォールバック
      console.warn('Google Books API failed, falling back to openBD:', (error as any)?.response?.status);
    }

    // Google Booksで見つからない or エラー時はopenBDで検索
    return getBookFromOpenBD(cleanIsbn);
  },
};
