import { Controller, Get, Param } from '@nestjs/common';
import { OrganisationInvitesService } from './services/organisation-invites.service';

// Deliberately unguarded — the pre-auth invite landing page needs to render
// organisation/invite context (name, invited email, validity) before the
// visitor has logged in or signed up. The token itself is the only secret;
// nothing here lets a caller enumerate or act on invites they don't hold the
// token for. Actually accepting an invite still requires CustomerAuthGuard —
// see AcceptOrganisationInviteController.
@Controller('api/organisation-invites')
export class OrganisationInviteLookupController {
  constructor(
    private readonly organisationInvitesService: OrganisationInvitesService,
  ) {}

  @Get(':token')
  lookup(@Param('token') token: string) {
    return this.organisationInvitesService.lookupPublic(token);
  }
}
