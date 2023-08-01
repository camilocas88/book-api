import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Book } from './schemas/book.schema';

import { Query } from 'express-serve-static-core';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: mongoose.Model<Book>,
  ) {}

  async findAll(query: Query): Promise<Book[]> {
    const resPerPage = 2; // results per page
    const currentPage = Number(query.page) || 1; // Page
    const skip = resPerPage * (currentPage - 1); // Skipping the results

    const keyWord = query.keyword
      ? {
          title: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const books = await this.bookModel
      .find({ ...keyWord })
      .limit(resPerPage)
      .skip(skip);
    return books;
  }

  async create(book: Book): Promise<Book> {
    const res = await this.bookModel.create(book);
    return res;
  }

  async findById(id: string): Promise<Book> {
    const book = await this.bookModel.findById(id);

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }
  async updateById(id: string, book: Book): Promise<Book> {
    return await this.bookModel.findByIdAndUpdate(id, book, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id: string): Promise<Book> {
    this.validateId(id);

    await this.ensureBookExists(id);

    try {
      return await this.bookModel.findByIdAndDelete(id);
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while deleting the book',
      );
    }
  }

  private validateId(id: string): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID');
    }
  }

  private async ensureBookExists(id: string): Promise<void> {
    const bookExists = await this.bookModel.exists({ _id: id });
    if (!bookExists) {
      throw new NotFoundException('Book not found');
    }
  }
}
