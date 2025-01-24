import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  /** 保存文件 */
  saveFile(
    file: Express.Multer.File,
    uploadDir: string,
  ): { fileName: string; size: number } {
    const { originalname, buffer, size } = file;
    // 解决中文文件名乱码
    const fileName = Buffer.from(originalname, 'latin1').toString('utf8');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    // 保存文件到指定路径
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return { fileName, size };
  }
}
