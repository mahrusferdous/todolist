const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const date = require(__dirname + "/date.js");
const _ = require('lodash');

const day = date.getDate();
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://id:password@cluster0.9gswc.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set('useFindAndModify', false)

const itemSchema = mongoose.Schema({
  name: String
})

const Item = mongoose.model("Item", itemSchema)

const item1 = new Item({
  name: "Welcome to yourtodolist!"
})

const item2 = new Item({
  name: "Hit the + button to add a new item."
})

const item3 = new Item({
  name: "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema)

// Item.deleteMany({name: "Welcome to yourtodolist!"}, function(err){})

app.get("/", function(req, res) {
  Item.find(function(err, foundItems) {
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Sucessfully installed.");
        }
      })
      res.redirect("/")
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }
  })
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  })
  if (listName === day){
    item.save()
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item)
      foundList.save()
      res.redirect("/" + listName)
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day){
    Item.deleteOne({_id: checkedItemId}, function(err){
      if(err) {
        console.log(err);
      } else {
        console.log("Sucessfully deleted.");
        res.redirect("/")
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
    })
  }
})

app.get("/:topic", function(req, res) {
  const customListName = _.capitalize(req.params.topic);

  List.findOne({name: customListName}, function(err, result){
    if(!err) {
      if (!result) {
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save()
        res.redirect("/" + customListName.toLowerCase())
      } else {
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items
        })
      }
    }
  })
})

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
