const Order = require("../models/order");
const User = require("../models/users");
const url = require("url");
const { encodeMsg } = require("../helper/createMsg");
const Course = require("../models/courses");
const Package = require("../models/package");

module.exports = {
  async payment(req, res) {
    var msg = { text: res.locals.error, type: "danger" };
    const userID = req.query.user;
    const cart = req.session.cart;
    let itemDetail = {
      type: cart.itemType,
    };
    try {
      if (userID) {
        const user = await User.findById(userID);
        if (user.verified) {
          // admin and regulator redirect to dashboard with msg
          // they can't buy a package
          if (user.role == "admin" || user.role == "regulator") {
            return res.redirect(
              url.format({
                pathname: "/dashboard",
                query: {
                  msg: encodeMsg(`${user.role} can't buy a package.`, "danger"),
                },
              })
            );
          }
          // if user has not select a package or course
          if (!cart.item) {
            const msg = encodeURIComponent(
              "Please! Select a Package/Course to continue."
            );
            const type = encodeURIComponent("danger");
            return res.redirect(`/?msg=${msg}&type=${type}`);
          }

          let orders = await Order.find({ user: user._id }).select(
            "package course user"
          );

          for (let i = 0; i < orders.length; i++) {
            let order = orders[i];
            /*
            if user have already purchase the course
            then redirect to dashboard
            */
            if (
              cart.itemType == "course" &&
              cart.item == order.course?.toString()
            ) {
              return req.login(user, function (err) {
                if (err) {
                  return next(err);
                }
                return res.redirect(
                  url.format({
                    pathname: "/dashboard",
                    query: {
                      msg: encodeMsg(
                        "You have already purchased a this course. You can also buy another one."
                      ),
                    },
                  })
                );
              });
            }
            // if user have already purchased any package then redirect to dashboard
            if (cart.itemType == "package" && order.package) {
              return req.login(user, function (err) {
                if (err) {
                  return next(err);
                }
                return res.redirect(
                  url.format({
                    pathname: "/dashboard",
                    query: {
                      msg: encodeMsg(
                        "You have already purchased a package. Please contact with admin for package changing."
                      ),
                    },
                  })
                );
              });
            }
          }

          if (cart.itemType == "course" && cart.item) {
            let course = await Course.findById(cart.item);
            itemDetail.name = course.name;
            itemDetail.price = course.price;
            itemDetail.total = course.price;
            itemDetail.tax = 0;
          }
          if (cart.itemType == "package" && cart.item) {
            let package = await Package.findById(cart.item);
            var { price, tax } = package;
            itemDetail.name = package.name;
            itemDetail.price = price;
            itemDetail.tax = tax;
            itemDetail.total = Math.round(price * ((100 + tax) / 100));
          }

          return res.render("payment", {
            title: "Payment",
            stripe_api: process.env.STRIPE_PUBLISHABLE_KEY,
            user,
            itemDetail,
            alert: res.locals.error.length > 0 ? msg : undefined,
            showDOB:
              user.driver_license == undefined || user.dob == undefined
                ? true
                : false,
          });
        } else {
          return res.redirect("/verification?user=" + req.user._id.toString());
        }
      }
      return res.redirect("/");
    } catch (error) {
      console.log(error);
      res.redirect("/");
    }
  },
};
