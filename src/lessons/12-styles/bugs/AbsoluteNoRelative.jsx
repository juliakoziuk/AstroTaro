export default function AbsoluteNoRelative() {
  return (
    <div style={{ width: 220, padding: 16, border: '1px solid #888', borderRadius: 10 }}>
      <span
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'tomato',
          color: '#fff',
          padding: '2px 8px',
          borderRadius: 8,
        }}
      >
        NEW
      </span>
      Картка товару: бейдж NEW має бути в її верхньому правому куті.
    </div>
  )
}
