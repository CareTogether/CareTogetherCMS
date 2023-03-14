import { Autocomplete, Button, FormControl, Grid, TextField } from '@mui/material';
import { AddCommunityMemberFamily, Community } from '../GeneratedClient';
import { useCommunityCommand, visibleFamiliesQuery } from '../Model/DirectoryModel';
import { useState } from 'react';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useRecoilValue } from 'recoil';
import { familyNameString } from '../Families/FamilyName';

interface DrawerProps {
  onClose: () => void;
}
interface AddMemberFamiliesFormProps extends DrawerProps {
  community: Community;
}
export function AddMemberFamiliesForm({ community, onClose }: AddMemberFamiliesFormProps) {
  interface CandidateFamily {
    id: string
    label: string // Required by Autocomplete component
  }

  const [families, setFamilies] = useState([] as CandidateFamily[]);

  const addMemberFamily = useCommunityCommand((communityId, familyId: string) => {
    const command = new AddCommunityMemberFamily();
    command.communityId = communityId;
    command.familyId = familyId;
    return command;
  });

  const withBackdrop = useBackdrop();

  async function save() {
    await withBackdrop(async () => {
      await Promise.all(families.map(async family =>
        await addMemberFamily(community.id!, family.id!)));
      onClose();
    });
  }

  const allFamilies = useRecoilValue(visibleFamiliesQuery);

  // Only include families that are not already members of this community
  const candidateFamilies = allFamilies.filter(family =>
    !community.memberFamilies?.includes(family.family!.id!)).sort((a, b) => {
      const aPrimaryContact = a.family!.adults!.find(adult =>
        a.family!.primaryFamilyContactPersonId === adult.item1!.id)!.item1!;
      const bPrimaryContact = b.family!.adults!.find(adult =>
        b.family!.primaryFamilyContactPersonId === adult.item1!.id)!.item1!;
      
      const aFirst = aPrimaryContact.firstName!;
      const aLast = aPrimaryContact.lastName!;
      const bFirst = bPrimaryContact.firstName!;
      const bLast = bPrimaryContact.lastName!;

      // Sort by last name, then by first name (of the family's primary contact)
      return aLast < bLast ? -1 : aLast > bLast ? 1 :
        aFirst < bFirst ? -1 : aFirst > bFirst ? 1 :
        0;
    }).map(family => ({
      id: family.family!.id!,
      label: familyNameString(family)
    } as CandidateFamily));

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>Add Member Families</h3>
      </Grid>
      <Grid item xs={12}>
        <FormControl required fullWidth size="small" sx={{marginTop: 1}}> 
          <Autocomplete
            multiple clearOnEscape disableCloseOnSelect
            onChange={(event: any, newValue: CandidateFamily[]) => {
              setFamilies(newValue);
            }}
            options={candidateFamilies}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField required {...params} label="Select families to add to this community" />}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button color='secondary' variant='contained'
          sx={{ marginRight: 2 }}
          onClick={onClose}>
          Cancel
        </Button>
        <Button color='primary' variant='contained'
          disabled={families.length === 0}
          onClick={save}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
