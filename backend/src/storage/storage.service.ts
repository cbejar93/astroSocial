// src/storage/storage.service.ts
import { Injectable, InternalServerErrorException, Logger, Inject } from '@nestjs/common'
import type { SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)

  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Uploads a Multer file buffer to the given bucket+path,
   * returns the public URL.
   */
  async uploadFile(
    bucket: string,
    filePath: string,
    file: Express.Multer.File,
  ): Promise<string> {
    this.logger.log(`Uploading to bucket="${bucket}" path="${filePath}"`)
    const { data, error } = await this.supabase
      .storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype,
      })

    if (error || !data) {
      this.logger.error(`Upload failed`, error?.message)
      throw new InternalServerErrorException('Storage upload failed')
    }

    const { data: urlData } = this.supabase
      .storage
      .from(bucket)
      .getPublicUrl(data.path)

    this.logger.log(`Public URL = ${urlData.publicUrl}`)
    return urlData.publicUrl
  }

  /**
   * Removes a file from the given bucket.
   */
  async deleteFile(bucket: string, filePath: string): Promise<void> {
    this.logger.log(`Deleting from bucket="${bucket}" path="${filePath}"`)

    const { error } = await this.supabase.storage.from(bucket).remove([filePath])

    if (error) {
      this.logger.error(`Delete failed`, error?.message)
      throw new InternalServerErrorException('Storage delete failed')
    }
  }
}