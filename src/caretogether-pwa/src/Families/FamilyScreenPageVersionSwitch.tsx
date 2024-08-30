import { useRecoilState } from 'recoil';
import PageVersionSwitch from '../Generic/PageVersionSwitch';
import { familyScreenV2State } from './familyScreenV2State';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { useEffect } from 'react';

export default function FamilyScreenPageVersionSwitch() {
  const [familyScreenV2Flag, setFamilyScreenV2Flag] =
    useRecoilState(familyScreenV2State);

  const flags = useFeatureFlags();

  useEffect(() => {
    if (familyScreenV2Flag === undefined) {
      setFamilyScreenV2Flag(flags?.familyScreenV2 ?? false);
    }
  }, [flags?.familyScreenV2, setFamilyScreenV2Flag, familyScreenV2Flag]);

  return (
    <PageVersionSwitch
      sx={{
        marginLeft: 'auto',
      }}
      checked={familyScreenV2Flag ?? false}
      onChange={(checked) => setFamilyScreenV2Flag(checked)}
      label="Use new family screen?"
    />
  );
}
