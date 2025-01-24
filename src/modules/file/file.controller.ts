import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Req,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response, Request, Express } from 'express';
import * as path from 'path';
import * as fs from 'node:fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { FileValidationPipe } from './pipes/file.validation.pipe';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' 是前端 FormData 中的键名
  uploadFile(
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 10,
        allowedTypes: ['application/x-zip-compressed'],
      }),
    )
    file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const uploadDir = path.join(process.cwd(), 'src/uploads/');
      const fileInfo = this.fileService.saveFile(file, uploadDir);

      return res.status(HttpStatus.CREATED).send({
        message: '文件上传成功',
        ...fileInfo,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Get('download')
  downloadFile(@Req() req: Request, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'src/files/', '19m.zip'); // 文件的绝对路径
    const fileName = '19m.zip'; // 下载时显示的文件名

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(HttpStatus.NOT_FOUND).send('文件不存在');
    }
    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);
    // 设置响应头
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    // 告诉浏览器文件大小 这样不会一直load进度条
    res.setHeader('Content-Length', stats.size);
    // 跨域配置后要允许响应头暴露
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    req.on('aborted', () => {
      console.log('客户端中止了下载请求');
      fileStream.destroy(); // 停止文件流
    });

    // 管道化文件流到响应
    fileStream.pipe(res).on('error', (err) => {
      console.error('文件下载出错:', err);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('文件下载出错');
      }
    });

    // 监听文件流完成事件
    fileStream.on('close', () => {
      console.log('文件下载完成');
    });
  }
}
