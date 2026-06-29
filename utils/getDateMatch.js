export const getDateMatch = ({ type, fromDate, toDate }) => {
  const now = new Date();
  let createdAt = {};

  switch (type) {
    case "custom": {
      if (!fromDate || !toDate) break;

      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      createdAt = { $gte: start, $lte: end };
      break;
    }

    case "today": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      createdAt = { $gte: start };
      break;
    }

    case "week": {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      createdAt = { $gte: start };
      break;
    }

    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      createdAt = { $gte: start };
      break;
    }

    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      createdAt = { $gte: start };
      break;
    }
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
};
