import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SocialPlatform } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    addSocialAccount: jest.Mock;
    listSocialAccountsForUser: jest.Mock;
    listSocialAccountsByUsername: jest.Mock;
    deleteSocialAccount: jest.Mock;
  };

  beforeEach(() => {
    service = {
      addSocialAccount: jest.fn(),
      listSocialAccountsForUser: jest.fn(),
      listSocialAccountsByUsername: jest.fn(),
      deleteSocialAccount: jest.fn(),
    };

    controller = new UsersController(service as unknown as UsersService);
  });

  it('adds a social account for the current user', async () => {
    const req = { user: { sub: 'user-123', email: 'test@example.com' } };
    const payload = {
      platform: SocialPlatform.TWITTER,
      url: 'https://twitter.com/example',
    };
    const response = {
      id: 'social-1',
      platform: SocialPlatform.TWITTER,
      url: 'https://twitter.com/example',
      metadata: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    service.addSocialAccount.mockResolvedValue(response);

    await expect(controller.addSocialAccount(req as any, payload)).resolves.toBe(
      response,
    );
    expect(service.addSocialAccount).toHaveBeenCalledWith('user-123', payload);
  });

  it('returns social accounts for the current user', async () => {
    const req = { user: { sub: 'user-123', email: 'test@example.com' } };
    const response = [
      {
        id: 'social-1',
        platform: SocialPlatform.GITHUB,
        url: 'https://github.com/example',
        metadata: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    service.listSocialAccountsForUser.mockResolvedValue(response);

    await expect(controller.getMySocialAccounts(req as any)).resolves.toBe(
      response,
    );
    expect(service.listSocialAccountsForUser).toHaveBeenCalledWith('user-123');
  });

  it('returns social accounts for a username', async () => {
    const response = [
      {
        id: 'social-1',
        platform: SocialPlatform.LINKEDIN,
        url: 'https://linkedin.com/in/example',
        metadata: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    service.listSocialAccountsByUsername.mockResolvedValue(response);

    await expect(
      controller.getUserSocialAccounts('someone'),
    ).resolves.toBe(response);
    expect(service.listSocialAccountsByUsername).toHaveBeenCalledWith('someone');
  });

  it('deletes a social account for the current user', async () => {
    const req = { user: { sub: 'user-123', email: 'test@example.com' } };
    service.deleteSocialAccount.mockResolvedValue(undefined);

    await expect(
      controller.deleteSocialAccount(req as any, 'social-1'),
    ).resolves.toEqual({ success: true });
    expect(service.deleteSocialAccount).toHaveBeenCalledWith(
      'user-123',
      'social-1',
    );
  });
});
