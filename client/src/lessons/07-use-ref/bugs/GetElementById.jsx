function NameField({ title }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <input id="name-field" type="text" placeholder="Ім’я" />{' '}
      <button onClick={() => document.getElementById('name-field').focus()}>Фокус у моє поле</button>
    </div>
  )
}

export default function GetElementById() {
  return (
    <div>
      <NameField title="Форма А" />
      <NameField title="Форма Б" />
    </div>
  )
}
