import {
  PipeTransform,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface Options {
  allowedTypes: string[];
  maxSize: number;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly options: Options;
  constructor(options: Partial<Options> = {}) {
    this.options = {
      allowedTypes: options.allowedTypes || [],
      maxSize: options.maxSize || Infinity,
    };
  }
  checkEmpty(file: Express.Multer.File) {
    if (file) return;
    throw new HttpException('文件未上传', HttpStatus.BAD_REQUEST);
  }
  checkSize(file: Express.Multer.File) {
    const { maxSize } = this.options;
    if (!maxSize) return;
    const maxFileSize = maxSize * 1024 * 1024;
    if (file.size > maxFileSize) {
      throw new HttpException(
        `文件大小超出限制，最大允许: ${maxFileSize / 1024 / 1024}MB`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  checkType(file: Express.Multer.File) {
    const { allowedTypes } = this.options;
    if (!allowedTypes.length) return;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new HttpException(
        `文件类型不支持，仅支持: ${allowedTypes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  transform(file: Express.Multer.File) {
    this.checkEmpty(file);
    this.checkSize(file);
    this.checkType(file);
    return file;
  }
}
