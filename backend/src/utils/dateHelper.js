const getWeekOfMonth = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  const day = date.getDate();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  return Math.ceil((day + firstDay) / 7);
};

module.exports = {
  getWeekOfMonth
};