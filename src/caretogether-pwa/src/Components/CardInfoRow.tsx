type CardInfoRowProps = {
  icon: string
}

export const CardInfoRow: React.FC<CardInfoRowProps> = ({
  icon,
  children
}) => (
  <>
    <div style={{lineHeight: 1, marginTop: 10, marginBottom: 10}}>
      <span style={{display: 'inline-block', width: 30}}>{icon}</span>
      {children}
    </div>
  </>
);
