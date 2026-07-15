import { EmployeeOrganisationMemberEcardController } from './employee-organisation-member-ecard.controller';
import type { EcardsService } from './services/ecards.service';

describe('EmployeeOrganisationMemberEcardController', () => {
  it('linkEcard forwards the organisationId, memberId, and parsed ecardId', async () => {
    const linkEcardForEmployee = jest
      .fn()
      .mockResolvedValue({ id: 'ecard-1', organisationId: 'org-1' });
    const controller = new EmployeeOrganisationMemberEcardController({
      linkEcardForEmployee,
    } as unknown as EcardsService);

    const result = await controller.linkEcard('org-1', 'member-1', {
      ecardId: 'ecard-1',
    });

    expect(linkEcardForEmployee).toHaveBeenCalledWith(
      'org-1',
      'member-1',
      'ecard-1',
    );
    expect(result).toEqual({ id: 'ecard-1', organisationId: 'org-1' });
  });
});
