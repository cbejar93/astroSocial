import { UsersService } from './users.service'
import { StorageService } from '../storage/storage.service'
import { PrismaService } from '../prisma/prisma.service'

describe('UsersService - uploadAvatar', () => {
  let service: UsersService
  let prisma: PrismaService | any
  let storage: Pick<StorageService, 'uploadFile' | 'deleteFile'>

  const supabase = {} as any
  const file = {
    originalname: 'avatar.png',
    mimetype: 'image/png',
    buffer: Buffer.from('avatar-file'),
  } as any

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    }

    storage = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    }

    service = new UsersService(
      supabase,
      storage as unknown as StorageService,
      prisma as PrismaService,
    )
  })

  it('deletes the existing avatar before uploading a replacement', async () => {
    const existingUrl =
      'https://example.supabase.co/storage/v1/object/public/avatars/user-123/avatar.png'
    const uploadedUrl =
      'https://example.supabase.co/storage/v1/object/public/avatars/user-123/avatar.png?v=2'

    const callOrder: string[] = []

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      avatarUrl: existingUrl,
    })
    ;(storage.uploadFile as jest.Mock).mockImplementation(async () => {
      callOrder.push('upload')
      return uploadedUrl
    })
    ;(storage.deleteFile as jest.Mock).mockImplementation(async () => {
      callOrder.push('delete')
    })
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})

    const result = await service.uploadAvatar('user-123', file)

    expect(storage.deleteFile).toHaveBeenCalledWith(
      'avatars',
      'user-123/avatar.png',
    )
    expect(storage.uploadFile).toHaveBeenCalledWith(
      'avatars',
      'user-123/avatar.png',
      file,
    )
    expect(callOrder).toEqual(['delete', 'upload'])
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { avatarUrl: uploadedUrl, profileComplete: true },
    })
    expect(result).toBe(uploadedUrl)
  })

  it('skips deletion when no prior avatar exists', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ avatarUrl: null })
    ;(storage.uploadFile as jest.Mock).mockResolvedValue('new-url')
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})

    const result = await service.uploadAvatar('user-123', file)

    expect(storage.deleteFile).not.toHaveBeenCalled()
    expect(storage.uploadFile).toHaveBeenCalledWith(
      'avatars',
      'user-123/avatar.png',
      file,
    )
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { avatarUrl: 'new-url', profileComplete: true },
    })
    expect(result).toBe('new-url')
  })

  it('propagates deletion errors', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      avatarUrl:
        'https://example.supabase.co/storage/v1/object/public/avatars/user-123/avatar.png',
    })
    ;(storage.deleteFile as jest.Mock).mockRejectedValue(new Error('boom'))

    await expect(service.uploadAvatar('user-123', file)).rejects.toThrow('boom')
    expect(storage.uploadFile).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
