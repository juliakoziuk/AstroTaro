export default function JustifyVsAlign() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        height: 120,
        background: '#e8e4ff',
      }}
    >
      <div style={{ background: 'tomato', color: '#fff', padding: 8 }}>Хочу по центру блоку</div>
    </div>
  )
}
