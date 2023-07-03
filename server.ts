// server.js
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
//import cors from 'cors';
//const express = require('express');
//const bodyParser = require('body-parser');
// const sqlite3 = require('sqlite3').verbose();
//아부스 추가
const cors = require('cors')

interface Todo {
  id: number;
  text: string;
  done: boolean;
  priority: number;
  memos: string;
}


// Create an Express application
const app = express();
// 아부스 추가
app.use(cors())

// Enable JSON body parsing middleware
app.use(express.json());

// Create and open SQLite database
let db = new sqlite3.Database('./myDatabase.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});

app.use(bodyParser.json());

// Create a table
db.run('CREATE TABLE IF NOT EXISTS todos(id INTEGER PRIMARY KEY, text TEXT, done INTEGER DEFAULT 0, priority INTEGER DEFAULT 1, memos TEXT)', (err) => {
  if (err) {
    console.log('Error creating table', err);
  } else {
    console.log('Table created');
  }
});


// Get all todos
app.get('/todos', (req: Request, res: Response) => {
  db.all('SELECT * FROM todos', [], (err: Error, rows: Todo[]) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    } else {
      //res.json(rows);
      // Convert 'done' field to boolean
      const todos = rows.map((row: Todo)  => ({
        ...row,
        done: !!row.done,
      }));
      res.status(200).json(todos);
    }
  });
});


// POST endpoint to add a new todo
app.post('/todos', (req: Request, res: Response) => {  
  console.log((req.body.text).length);
  if ((req.body.text).length === 0){
    console.log("글자길이 : 0");
  } else{
    db.run('INSERT INTO todos(text, done, priority, memos) VALUES(?, ?, ?, ?)', [req.body.text, false, req.body.priority, req.body.memos], function (err: Error) {
      if (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ id: this.lastID, text: req.body.text, done: 0, priority: req.body.priority, memos: req.body.memos, message: this });
      }
    });
  }  
});

// PATCH endpoint to update a todo
app.patch('/todos/:id', (req: Request, res: Response) => {
  const {body} = req 
  console.log("수정함");
  console.log(body.text);
  console.log(body.done);
  db.run('UPDATE todos SET text = ?, priority = ?, memos = ? WHERE id = ?', [req.body.text, req.body.priority, req.body.memos, req.params.id], function (err: Error) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    } else {
      //1이 정상
      if(this.changes === 1){
        res.status(200).json({ id: req.params.id, text: req.body.text, priority: req.body.priority, memos: req.body.memos, message: this });
      }else{
        res.status(404).json({ id: req.params.id, text: req.body.text, priority: req.body.priority, memos: req.body.memos, message: this });
      }      
    }
  });
});
// 메모 기능용
app.patch('/todos/memo/:id', (req: Request, res: Response) => {
  console.log("수정함");
  console.log(req.body);
  console.log(req.params);   
  db.run('UPDATE todos SET memos = ? WHERE id = ?', [req.body.memos, req.params.id], function (err: Error) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    } else {
      // 1이 정상
      if(this.changes === 1){
        res.status(200).json({ id: req.params.id, memos: req.body.memos, message: this });
      }else{
        res.status(404).json({ id: req.params.id, memos: req.body.memos, message: this });
      }
      
    }
  });
});

// PATCH endpoint to update a todo's done status
app.patch('/todos/:id/done', (req: Request, res: Response) => {
  console.log(req.body.done);
  db.run('UPDATE todos SET done = ? WHERE id = ?', [req.body.done, req.params.id], function (err: Error) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    } else {      
      // 1이 정상 
      if(this.changes === 1){
        res.status(200).json({ id: req.params.id, done: req.body.done, message: this });
      }else{
        res.status(404).json({ id: req.params.id, done: req.body.done, message: this });
      }      
    }
  });
});

// DELETE endpoint to remove a todo
// 
app.delete('/todos/:id', (req: Request, res: Response) => {
  console.log("선택 삭제")
  db.run('DELETE FROM todos WHERE id = ?', [req.params.id], function (err: Error) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    } else {
      // 1 일 경우 정상
      if(this.changes === 1){
        res.status(200).json({ id: req.params.id, message: this });
      }else{
        res.status(404).json({ id: req.params.id, message: this });
      }
    }
  });
});
// DELETE endpoint to delete all completed todos
app.delete('/todos/chk/completed', (req: Request, res: Response) => {
  console.log("완료 목록 삭제")
  db.run(`DELETE FROM todos WHERE done=1`, function(err: Error) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    } else {
      // res.status(200).json({ count: this.changes, message: this });
      // 요청된 삭제 다수 0 이라도 에러가 아님
      if(this.changes === 0){
        res.status(201).json({ count: this.changes, message: this });
      }else{
        res.status(200).json({ count: this.changes, message: this });
      }      
    }
  });    
});

// Start the server
app.listen(3001, () => console.log('Server listening on port 3001'));
