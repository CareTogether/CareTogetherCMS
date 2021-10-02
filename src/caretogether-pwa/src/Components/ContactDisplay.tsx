import { ContactInfo } from "../GeneratedClient";
import { CardInfoRow } from "./CardInfoRow";

type ContactDisplayProps = {
  contact: ContactInfo
}

export function ContactDisplay({ contact }: ContactDisplayProps) {
  const preferredPhoneNumber = contact.phoneNumbers?.find(x => x.id === contact.preferredPhoneNumberId);
  const preferredEmailAddress = contact.emailAddresses?.find(x => x.id === contact.preferredEmailAddressId);
  const currentAddress = contact.addresses?.find(x => x.id === contact.currentAddressId);

  return (
    <>
      {preferredPhoneNumber && <CardInfoRow icon='📞'>{preferredPhoneNumber.number}</CardInfoRow>}
      {preferredEmailAddress && <CardInfoRow icon='📧'>{preferredEmailAddress.address}</CardInfoRow>}
      {currentAddress && <CardInfoRow icon='🏠'>
        <p style={{display: 'inline-block', margin: 0}}>
          {currentAddress.line1}<br />
          {currentAddress.line2 && <>{currentAddress.line2}<br /></>}
          {currentAddress.city},&nbsp;{currentAddress.state}&nbsp;{currentAddress.postalCode}
        </p>
      </CardInfoRow>}
    </>
  );
}