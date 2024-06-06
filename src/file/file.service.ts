import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { access, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import * as sharp from 'sharp';
import { v4 } from 'uuid';
import { FileResponse } from './file.interface';
import { MFile } from './mfile.class';

@Injectable()
export class FileService {
  async saveFiles(files: MFile[], folder = 'default') {
    const uploadFolder = join(__dirname, '..', '..', 'uploads', folder);

    try {
      await access(uploadFolder);
    } catch (e) {
      await mkdir(uploadFolder, { recursive: true });
    }

    const res: FileResponse[] = await Promise.all(
      files.map(async (file): Promise<FileResponse> => {
        try {
          await writeFile(join(uploadFolder, file.originalname), file.buffer);
        } catch (e) {
          throw new InternalServerErrorException('Error while saving file');
        }

        return {
          url: `/uploads/${folder}/${file.originalname}`,
          name: file.originalname
        };
      })
    );
    return res;
  }

  convertToWebP(file: Buffer): Promise<Buffer> {
    return sharp(file).webp().toBuffer();
  }

  async filterFile(files: MFile[]) {
    const newFiles = await Promise.all(
      files.map(async (file) => {
        const mimetype = file.mimetype;
        const currentFileType = file.mimetype.split('/')[1];
        const newName = v4();
        const type = file.originalname.split('.')[1];

        if (mimetype.includes('image')) {
          if (currentFileType !== 'svg+xml') {
            const buffer = await this.convertToWebP(file.buffer);
            return new MFile({
              buffer,
              originalname: `${newName}.webp`,
              mimetype
            });
          }
          return new MFile({
            buffer: file.buffer,
            originalname: `${newName}.svg`,
            mimetype
          });
        }

        return new MFile({
          buffer: file.buffer,
          originalname: `${newName}.${type}`,
          mimetype
        });
      })
    );
    return newFiles;
  }
}
