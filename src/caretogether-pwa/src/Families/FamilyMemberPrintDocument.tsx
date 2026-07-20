import { differenceInYears, format } from 'date-fns';
import {
  Age,
  AgeInYears,
  CustodialRelationship,
  CustodialRelationshipType,
  EmailAddressType,
  ExactAge,
  Gender,
  Person,
  PhoneNumberType,
} from '../GeneratedClient';
import type { ReactNode } from 'react';
import {
  personFullName,
  type PrintableCustomFieldSection,
  type PrintableFamilyMember,
} from './FamilyMemberPrintData';

function formatDateOfBirth(age?: Age) {
  if (!(age instanceof ExactAge) || !age.dateOfBirth) return undefined;

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(age.dateOfBirth));
}

function formatAge(age?: Age) {
  if (age instanceof ExactAge && age.dateOfBirth) {
    return `${differenceInYears(new Date(), new Date(age.dateOfBirth))}`;
  }

  if (age instanceof AgeInYears && age.years && age.asOf) {
    return `${age.years + differenceInYears(new Date(), age.asOf)}`;
  }

  return undefined;
}

function formatAddress(person: Person) {
  const address =
    person.addresses?.find((a) => a.id === person.currentAddressId) ??
    person.addresses?.[0];

  if (!address) return undefined;

  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(', '),
    address.county ? `${address.county} County` : undefined,
  ]
    .filter(Boolean)
    .join(' ');
}

function formatPhoneNumbers(person: Person) {
  return (person.phoneNumbers ?? [])
    .filter((phoneNumber) => phoneNumber.number)
    .map((phoneNumber) => {
      const type =
        phoneNumber.type === undefined
          ? undefined
          : PhoneNumberType[phoneNumber.type];
      const preferred =
        phoneNumber.id && phoneNumber.id === person.preferredPhoneNumberId;
      return [
        type ? `${type}:` : undefined,
        phoneNumber.number,
        preferred ? '(preferred)' : undefined,
      ]
        .filter(Boolean)
        .join(' ');
    });
}

function formatEmailAddresses(person: Person) {
  return (person.emailAddresses ?? [])
    .filter((emailAddress) => emailAddress.address)
    .map((emailAddress) => {
      const type =
        emailAddress.type === undefined
          ? undefined
          : EmailAddressType[emailAddress.type];
      const preferred =
        emailAddress.id && emailAddress.id === person.preferredEmailAddressId;
      return [
        type ? `${type}:` : undefined,
        emailAddress.address,
        preferred ? '(preferred)' : undefined,
      ]
        .filter(Boolean)
        .join(' ');
    });
}

function custodialRelationshipLabel(type?: CustodialRelationshipType) {
  if (type === CustodialRelationshipType.LegalGuardian) {
    return 'Legal guardian';
  }

  if (type === CustodialRelationshipType.ParentWithCustody) {
    return 'Parent with custody';
  }

  if (type === CustodialRelationshipType.ParentWithCourtAppointedCustody) {
    return 'Parent with court-appointed sole custody';
  }

  return undefined;
}

type FamilyMemberPrintDocumentProps = {
  member: PrintableFamilyMember | null;
  canViewDateOfBirth: boolean;
  familyAdults: Person[];
  familyChildren: Person[];
  custodialRelationships: CustodialRelationship[];
  customFieldSections: PrintableCustomFieldSection[];
};

function PrintableInfoRow({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.length === 0)
  ) {
    return null;
  }

  return (
    <div className="print-info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PrintableList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="print-list">
      {items.map((item, index) => (
        <li key={`${item}:${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export function FamilyMemberPrintDocument({
  member,
  canViewDateOfBirth,
  familyAdults,
  familyChildren,
  custodialRelationships,
  customFieldSections,
}: FamilyMemberPrintDocumentProps) {
  if (!member) {
    return <div />;
  }

  const { person } = member;
  const gender =
    person.gender === undefined ? undefined : Gender[person.gender];
  const childRelationships = familyChildren.map((child) => {
    const relationship = custodialRelationships.find(
      (r) => r.childId === child.id && r.personId === person.id
    );
    const relationshipText = custodialRelationshipLabel(relationship?.type);
    return `${personFullName(child)}${canViewDateOfBirth && formatDateOfBirth(child.age) ? `, DOB ${formatDateOfBirth(child.age)}` : ''}${relationshipText ? ` - ${relationshipText}` : ''}`;
  });
  const adultRelationships = custodialRelationships
    .filter((relationship) => relationship.childId === person.id)
    .map((relationship) => {
      const adult = familyAdults.find((a) => a.id === relationship.personId);
      if (!adult) return undefined;

      const relationshipText = custodialRelationshipLabel(relationship.type);
      const contact =
        formatPhoneNumbers(adult)[0] ?? formatEmailAddresses(adult)[0];
      return [personFullName(adult), relationshipText, contact]
        .filter(Boolean)
        .join(' - ');
    })
    .filter((value): value is string => value !== undefined);
  const title =
    member.kind === 'adult' ? 'Parent Information' : 'Child Information';

  return (
    <article className="family-member-print-document">
      <style>
        {`
          .family-member-print-document {
            box-sizing: border-box;
            width: 7.5in;
            min-height: 10in;
            padding: 0.35in;
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11pt;
            line-height: 1.35;
            background: #fff;
          }

          .family-member-print-document * {
            box-sizing: border-box;
          }

          .family-member-print-document h1 {
            margin: 0 0 0.04in;
            font-size: 26pt;
            font-weight: 700;
            letter-spacing: 0;
          }

          .print-document-type {
            margin-bottom: 0.02in;
            font-size: 11pt;
            font-weight: 700;
            letter-spacing: 0;
            text-transform: uppercase;
          }

          .print-date {
            font-size: 9pt;
          }

          .family-member-print-document h2 {
            margin: 0.2in 0 0.08in;
            padding-bottom: 0.04in;
            border-bottom: 1px solid #222;
            font-size: 12pt;
            font-weight: 700;
            letter-spacing: 0;
            text-transform: uppercase;
          }

          .family-member-print-document dl {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.06in 0.22in;
            margin: 0;
          }

          .print-info-row {
            break-inside: avoid;
          }

          .print-info-row dt {
            margin: 0;
            font-size: 8.5pt;
            font-weight: 700;
            text-transform: uppercase;
          }

          .print-info-row dd {
            min-height: 0.2in;
            margin: 0;
            padding-bottom: 0.03in;
            border-bottom: 1px solid #aaa;
            white-space: pre-wrap;
          }

          .family-member-print-document .full-width {
            grid-column: 1 / -1;
          }

          .print-list {
            margin: 0;
            padding-left: 0.18in;
          }

          .custom-field-table {
            width: 100%;
            border-collapse: collapse;
          }

          .custom-field-table th,
          .custom-field-table td {
            padding: 0.04in 0.06in;
            border: 1px solid #999;
            text-align: left;
            vertical-align: top;
          }

          .custom-field-table th {
            width: 35%;
            font-weight: 700;
            background: #f3f3f3;
          }

          @page {
            margin: 0.5in;
          }
        `}
      </style>

      <header>
        <div className="print-document-type">{title}</div>
        <h1>{personFullName(person)}</h1>
        <div className="print-date">
          Printed {format(new Date(), 'M/d/yyyy')}
        </div>
      </header>

      <section>
        <h2>Personal Details</h2>
        <dl>
          <PrintableInfoRow label="First name" value={person.firstName} />
          <PrintableInfoRow label="Last name" value={person.lastName} />
          <PrintableInfoRow
            label="Date of birth"
            value={
              canViewDateOfBirth ? formatDateOfBirth(person.age) : undefined
            }
          />
          <PrintableInfoRow label="Age" value={formatAge(person.age)} />
          <PrintableInfoRow label="Gender" value={gender} />
          <PrintableInfoRow label="Ethnicity" value={person.ethnicity} />
          {member.kind === 'adult' && (
            <>
              <PrintableInfoRow
                label="Relationship to family"
                value={member.relationshipToFamily?.relationshipToFamily}
              />
              <PrintableInfoRow
                label="Household"
                value={
                  member.relationshipToFamily?.isInHousehold
                    ? 'In household'
                    : 'Not in household'
                }
              />
            </>
          )}
        </dl>
      </section>

      <section>
        <h2>Contact</h2>
        <dl>
          <PrintableInfoRow label="Address" value={formatAddress(person)} />
          <PrintableInfoRow
            label="Phone numbers"
            value={<PrintableList items={formatPhoneNumbers(person)} />}
          />
          <PrintableInfoRow
            label="Email addresses"
            value={<PrintableList items={formatEmailAddresses(person)} />}
          />
        </dl>
      </section>

      <section>
        <h2>
          {member.kind === 'adult' ? 'Children' : 'Parents and Guardians'}
        </h2>
        <dl>
          <PrintableInfoRow
            label={member.kind === 'adult' ? 'Children' : 'Adults'}
            value={
              <PrintableList
                items={
                  member.kind === 'adult'
                    ? childRelationships
                    : adultRelationships
                }
              />
            }
          />
        </dl>
      </section>

      <section>
        <h2>Notes and Concerns</h2>
        <dl>
          <PrintableInfoRow label="Concerns" value={person.concerns} />
          <PrintableInfoRow label="Notes" value={person.notes} />
        </dl>
      </section>

      {customFieldSections.map((section, sectionIndex) => (
        <section key={section.groupingKey ?? `custom-fields-${sectionIndex}`}>
          <h2>{section.groupingKey ?? 'Custom Fields'}</h2>
          <table className="custom-field-table">
            <tbody>
              {section.customFields.map((customField) => (
                <tr key={customField.name}>
                  <th>{customField.name}</th>
                  <td>{customField.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </article>
  );
}
