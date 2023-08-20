const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName].length) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function priceIsValidNumber(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (!Number(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0.",
    });
  }
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0.",
    });
  }
  next();
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newId = nextId();
  const newDish = {
    id: newId,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

function dishIdMatch(req, res, next) {
  const { data: { id } = {} } = req.body;
  if (id) {
    const { dishId } = req.params;
    if (dishId === id) {
      return next();
    }
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}.`,
    });
  }
  return next();
}

function update(req, res) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  const { data: { name, description, price, image_url } = {} } = req.body;

  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.json({ data: foundDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("image_url"),
    // bodyDataHas("price"),
    priceIsValidNumber,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("image_url"),
    // bodyDataHas("price"),
    priceIsValidNumber,
    dishIdMatch,
    update,
  ],
};
