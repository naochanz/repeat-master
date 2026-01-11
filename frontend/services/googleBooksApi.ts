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

export const googleBooksApi = {
  /**
   * ISBNから本の情報を取得
   */
  async getBookByISBN(isbn: string): Promise<BookInfo | null> {
    try {
      // ISBNからハイフンを除去
      const cleanIsbn = isbn.replace(/-/g, '');

      const response = await axios.get(GOOGLE_BOOKS_API_URL, {
        params: {
          q: `isbn:${cleanIsbn}`,
        },
      });

      if (response.data.totalItems === 0) {
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
    } catch (error) {
      console.error('Failed to fetch book info:', error);
      return null;
    }
  },
};
