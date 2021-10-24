import { Person } from "../GeneratedClient";
import { CardInfoRow } from "./CardInfoRow";

type ContactDisplayProps = {
  person: Person
}

export function ContactDisplay({ person }: ContactDisplayProps) {
  const preferredPhoneNumber = person.phoneNumbers?.find(x => x.id === person.preferredPhoneNumberId);
  const preferredEmailAddress = person.emailAddresses?.find(x => x.id === person.preferredEmailAddressId);
  const currentAddress = person.addresses?.find(x => x.id === person.currentAddressId);

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