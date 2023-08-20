const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || !dishes.length) {
    next({
      status: 400,
      message: "Order must include at least one dish.",
    });
  }
  next();
}

function dishQuantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish, index) => {
    if (!dish.quantity || typeof(dish.quantity) !== "number" || dish.quantity <=0) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 1.`,
      })
      }
    });
    next();
  }

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
}

function validateOrderId(req, res, next) {
  const { data: { id } = {} } = req.body;
  if (id) {
    const { orderId } = req.params;
    if (id !== orderId) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
      });
    }
    next();
  }
  return next();
}

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message:
    "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function statusNotDelivered(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status !== "delivered") {
    return next();
  }
  next({
    status: 400,
    message: "A delivered order cannot be changed.",
  });
}

function statusToDelete(req, res, next) {
  const orderStatus = res.locals.order.status;
  if (orderStatus !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }
  next();
}

function create(req, res) {
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes: { id, name, description, price, image_url, quantity },
    } = {},
  } = req.body;
  const newId = nextId();
  const newOrder = {
    id: newId,
    deliverTo,
    mobileNumber,
    status,
    dishes: [{ id, name, description, price, image_url, quantity }],
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  const order = res.locals.order;
  const newDishes = res.locals.order.dishes;
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes,
    } = {},
  } = req.body;

    order.deliverTo = deliverTo,
    order.mobileNumber = mobileNumber,
    order.status = status,
    order.dishes = newDishes;
  res.json({ data: order });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function list(req, res, next) {
  res.json({ data: orders });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesPropertyIsValid,
    dishQuantityIsValid,
    create,
  ],

  read: [orderExists, read],
  update: [
    orderExists,
    validateOrderId,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    dishesPropertyIsValid,
    dishQuantityIsValid,
    statusPropertyIsValid,
    statusNotDelivered,
    update,
  ],
  delete: [orderExists, statusToDelete, destroy],
};