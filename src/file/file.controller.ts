import { Controller, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';

@Controller('api/upload')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('file', 10))
  async uploadFile(
    @UploadedFiles() files: Express.Multer.File | Express.Multer.File[],
    @Query('folder') folder?: string
  ) {
    const filesArr = Array.isArray(files) ? files : [files];
    const newFiles = await this.fileService.filterFile(filesArr);
    return this.fileService.saveFiles(newFiles, folder);
  }
}
