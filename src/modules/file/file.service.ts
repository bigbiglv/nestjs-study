import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/** 文件保存路径 */
const FILE_DIR = path.join(process.cwd(), 'files/upload');

@Injectable()
export class FileService {
  /** 合并文件切片 */
  mergeChunks(chunksDir: string, total: number, outputPath: string = FILE_DIR) {
    if (!fs.existsSync(chunksDir)) throw new Error('文件切片目录不存在');
    try {
      const fileName = path.basename(chunksDir);
      const writeStream = fs.createWriteStream(path.join(outputPath, fileName));
      for (let i = 0; i < total; i++) {
        const chunkPath = path.join(chunksDir, String(i));
        const data = fs.readFileSync(chunkPath);
        writeStream.write(data);
      }
      writeStream.end();

      // 删除临时分片目录
      fs.rmSync(chunksDir, { recursive: true, force: true });

      return { message: '文件合并成功', data: outputPath };
    } catch (error) {
      throw new Error(`文件合并失败: ${error}`);
    }
  }

  /** 保存切片文件 */
  saveChunk({
    file,
    index,
    total,
    fileName,
  }: {
    file: Express.Multer.File;
    index: string;
    total: string;
    fileName: string;
  }) {
    const { buffer } = file;
    const chunksPath = path.join(
      process.cwd(),
      'files/upload/chunk/',
      fileName,
    );
    // 确保文件夹存在
    if (!fs.existsSync(chunksPath)) {
      fs.mkdirSync(chunksPath, { recursive: true });
    }
    // 修改文件名为下标并保存文件
    const filePath = path.join(chunksPath, String(index));
    fs.writeFileSync(filePath, buffer);
    // 校验分片数
    const missChunks = this.getMissChunks(chunksPath, Number(total));
    // 合并
    if (!missChunks.length) return this.mergeChunks(chunksPath, Number(total));
    return { message: 'ok', data: missChunks };
  }

  /** 缺少的切片数 */
  getMissChunks(chunkDir: string, chunkLength: number) {
    const fileNames = fs.readdirSync(chunkDir);
    const missChunks = [...Array(chunkLength).keys()];
    for (let i = 0; i < fileNames.length; i++) {
      const chunkName = Number(fileNames[i]);
      // 异常文件名 直接删除
      if (Number.isNaN(chunkName)) {
        fs.unlinkSync(path.join(chunkDir, fileNames[i]));
        continue;
      }
      const index = missChunks.findIndex((chunk) => chunk === chunkName);
      missChunks.splice(index, 1);
    }
    return missChunks;
  }

  /** 保存文件 */
  saveFile(
    file: Express.Multer.File,
    uploadDir: string = FILE_DIR,
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

  getFileStream(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }
    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    return {
      stats,
      fileStream,
      fileName,
    };
  }
}
