export default function FlexNoHeight() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '2px dashed #888' }}>
      <div style={{ flex: 1, background: '#e8e4ff', padding: 8 }}>
        Я з flex: 1, хочу заповнити всю висоту рамки (але висоти в рамки немає)
      </div>
    </div>
  )
}
