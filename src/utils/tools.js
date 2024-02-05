export const log = (content) => console.log(content);
export const formatDate = (date) => {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let mins = date.getMinutes();
  let secs = date.getSeconds();

  const monthTxt = month < 10 ? `0${month}` : `${month}`;
  const dayTxt = day < 10 ? `0${day}` : `${day}`;
  const hourTxt = hour < 10 ? `0${hour}` : `${hour}`;
  const minsTxt = mins < 10 ? `0${mins}` : `${mins}`;
  const secsTxt = secs < 10 ? `0${secs}` : `${secs}`;

  const toString = `${year}-${monthTxt}-${dayTxt}`;
  const array = toString.split("-");

  return {
    id: `${year}${monthTxt}${dayTxt}${hourTxt}${minsTxt}${secsTxt}`,
    toString,
    date: new Date(array[0], array[1] - 1, array[2]),
    regresive: `${hourTxt}:${minsTxt}:${secsTxt}`
  };
};
