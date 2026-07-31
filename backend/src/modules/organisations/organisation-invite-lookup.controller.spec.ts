import { OrganisationInviteLookupController } from './organisation-invite-lookup.controller';
import type { OrganisationInvitesService } from './services/organisation-invites.service';

function makeController(
  organisationInvitesService: Partial<OrganisationInvitesService> = {},
) {
  return new OrganisationInviteLookupController(
    organisationInvitesService as OrganisationInvitesService,
  );
}

describe('OrganisationInviteLookupController', () => {
  it('lookup forwards the token to the service', async () => {
    const lookupPublic = jest.fn().mockResolvedValue({
      organisationName: 'Acme Inc',
      email: 'invitee@example.com',
      role: 'MEMBER',
      status: 'PENDING',
      expiresAt: new Date(),
      emailFlowEnabled: false,
    });
    const controller = makeController({ lookupPublic });

    const result = await controller.lookup('some-token');

    expect(lookupPublic).toHaveBeenCalledWith('some-token');
    expect(result).toMatchObject({ organisationName: 'Acme Inc' });
  });
});
