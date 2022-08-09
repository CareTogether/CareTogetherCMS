import { Drawer, TextField, Button, Divider, useMediaQuery, useTheme, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { CombinedFamilyInfo, DirectoryClient, SendSmsToFamilyPrimaryContactsRequest, SmsResult, ValueTupleOfGuidAndSmsMessageResult } from "../GeneratedClient";
import { organizationConfigurationData } from "../Model/ConfigurationModel";
import { useFamilyLookup } from "../Model/DirectoryModel";
import { currentOrganizationState, currentLocationState } from "../Model/SessionModel";
import { useBackdrop } from "../Hooks/useBackdrop";
import { FamilyName } from "../Families/FamilyName";

type BulkSmsSideSheetProps = {
  selectedFamilies: CombinedFamilyInfo[]
  onClose: () => void
}

// U+00AD is the soft hyphen.
const phonePattern = /^\(?([0-9]{3})\)?[\u{00ad}\-.\s]?([0-9]{3})[\u{00ad}\-.\s]?([0-9]{4})/u;

export function BulkSmsSideSheet({ selectedFamilies, onClose }: BulkSmsSideSheetProps) {
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);
  const organizationConfiguration = useRecoilValue(organizationConfigurationData);
  
  const familiesSelectedForSms = selectedFamilies.map(family => {
    const primaryAdult = family.family!.adults!.find(adult => adult.item1!.id === family.family!.primaryFamilyContactPersonId);
    const preferredPhone = primaryAdult?.item1?.phoneNumbers?.find(phone => phone.id === primaryAdult?.item1?.preferredPhoneNumberId);
    const isPhoneValid = phonePattern.test(preferredPhone?.number || "");
    return {
      family,
      preferredPhone,
      isPhoneValid
    };
  });

  const smsSourcePhoneNumbers = organizationConfiguration.locations?.find(loc =>
    loc.id === locationId)?.smsSourcePhoneNumbers;
  
  const [selectedSourceNumber, setSelectedSourceNumber] = useState("");

  const [smsMessage, setSmsMessage] = useState("");
  const [smsResults, setSmsResults] = useState<ValueTupleOfGuidAndSmsMessageResult[] | null>(null);

  const withBackdrop = useBackdrop();
  async function sendSmsToVisibleFamilies() {
    await withBackdrop(async () => {
      const familyIds = familiesSelectedForSms.map(family => family.family!.family!.id!);
  
      const client = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const sendSmsResults = await client.sendSmsToFamilyPrimaryContacts(organizationId, locationId,
        new SendSmsToFamilyPrimaryContactsRequest({
          familyIds: familyIds,
          sourceNumber: selectedSourceNumber,
          message: smsMessage
        }));
      
      setSmsResults(sendSmsResults);
    });
  }

  const familyLookup = useFamilyLookup();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Drawer variant="persistent" anchor={isMobile ? "bottom" : "right"} open
      PaperProps={{ sx: { padding: isMobile ? 1 : 2, width: isMobile ? null : 400, height: isMobile ? 500 : null } }}>
      <h3 style={{ marginTop: isMobile ? 0 : 40, marginBottom: 0 }}>
        Send SMS to these {familiesSelectedForSms.length} families?
      </h3>
      <p>
        The SMS will be sent to the preferred phone number on file for each family's primary contact person.
        If no preferred number is on file for the primary contact, that family will not be sent an SMS.
      </p>
      <FormControl required fullWidth size="small">
        <InputLabel id="sourcenumber-label">Source number</InputLabel>
        <Select
          labelId="sourcenumber-label" id="sourcenumber"
          value={selectedSourceNumber}
          onChange={e => setSelectedSourceNumber(e.target.value as string)}>
            <MenuItem key="placeholder" value="" disabled>
              Select a source number
            </MenuItem>
            {smsSourcePhoneNumbers?.map(smsSourcePhoneNumber =>
              <MenuItem key={smsSourcePhoneNumber.sourcePhoneNumber} value={smsSourcePhoneNumber.sourcePhoneNumber}>
                {smsSourcePhoneNumber.sourcePhoneNumber} - {smsSourcePhoneNumber.description}
              </MenuItem>)}
        </Select>
      </FormControl>
      <br />
      <TextField multiline maxRows={8} placeholder="Enter the SMS message to send. Remember to keep it short!"
        value={smsMessage} onChange={(event) => setSmsMessage(event.target.value)} />
      <Button onClick={() => { setSmsMessage(""); setSmsResults(null); onClose(); } } color="secondary">
        Cancel
      </Button>
      <Button onClick={sendSmsToVisibleFamilies} variant="contained" color="primary"
        disabled={familiesSelectedForSms.length === 0 || smsMessage.length === 0 || selectedSourceNumber === ""}>
        Send Bulk SMS
      </Button>
      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      {smsResults == null
        ? <>
          {familiesSelectedForSms.filter(family => !family.isPhoneValid).length === 0
            ? <>
              <p style={{ margin: 0 }}>
                ✔&nbsp;
                All selected families have valid phone numbers.
              </p>
            </>
            : <>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                ⚠&nbsp;
                Some families have invalid phone numbers!
              </p>
              <ul style={{ margin: 0, listStyleType: 'none', padding: 0 }}>
                {familiesSelectedForSms.filter(family => !family.isPhoneValid).map(family => (
                  <li key={family.family.family!.id}>
                    <span>
                      <FamilyName family={family.family} />:&nbsp;
                      {family.preferredPhone?.number == null || typeof family.preferredPhone?.number === 'undefined'
                        ? "(no number provided)"
                        : `'${family.preferredPhone?.number}'`}
                    </span>
                  </li>
                ))}
              </ul>
            </>}
        </>
        : <>
          <table>
            <tbody>
              <tr>
                <td># of primary contacts without a preferred phone number</td>
                <td>{smsResults.filter(x => x.item2 == null).length}</td>
              </tr>
              <tr>
                <td># of messages sent successfully</td>
                <td>{smsResults.filter(x => x.item2?.result === SmsResult.SendSuccess).length}</td>
              </tr>
              <tr>
                <td># of send failures</td>
                <td>{smsResults.filter(x => x.item2?.result === SmsResult.SendFailure).length}</td>
              </tr>
              <tr>
                <td># of invalid source numbers</td>
                <td>{smsResults.filter(x => x.item2?.result === SmsResult.InvalidSourcePhoneNumber).length}</td>
              </tr>
              <tr>
                <td># of invalid phone numbers (list below)</td>
                <td>{smsResults.filter(x => x.item2?.result === SmsResult.InvalidDestinationPhoneNumber).length}</td>
              </tr>
            </tbody>
          </table>
          <ul style={{ margin: 0, listStyleType: 'none', padding: 0 }}>
            {smsResults.filter(x => x.item2?.result === SmsResult.InvalidDestinationPhoneNumber).map(x => (
              <li key={x.item1}><span><FamilyName family={familyLookup(x.item1)} />: '{x.item2?.phoneNumber}'</span></li>
            ))}
          </ul>
        </>}
    </Drawer>
  );
}
