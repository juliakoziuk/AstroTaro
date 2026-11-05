// Цільова кількість дій за місяць (розклади + сни + записи + повідомлення), яку вважаємо 100 % прогресу
export const MONTHLY_GOAL = 30

export const progressPercent = (activities: number) => Math.min(100, Math.round((activities * 100) / MONTHLY_GOAL))
