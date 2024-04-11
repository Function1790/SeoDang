create table user(
    num int not null auto_increment, 
    uid text not null, 
    upw text not null, 
    name text not null,
    schoolid int not null, 
    nickname text not null, 
    primary key(num)
);
insert into user (uid, upw, name, schoolid, nickname) values ("guest", "guest", "guest", 220318, "guest");
insert into user (uid, upw, name, schoolid, nickname) values ("sr1234", "sr1234", "홍길동", 230101, "서령고마법쟁이");
insert into user (uid, upw, name, schoolid, nickname) values ("sr0000", "sr0000", "김철수", 230102, "영희 전남친");
insert into user (uid, upw, name, schoolid, nickname) values ("admin", "admin", "관리자", 240000, "관리자");

create table item(
    num int not null auto_increment, 
    title text not null, 
    content text not null, 
    category text not null,
    price int not null,
    contact text not null,
    post_time datetime not null,
    isSelled tinyint,
    seller text not null,
    primary key(num)
);
alter table item add imgName text;
alter table item add seller_num int;
insert into item (title, content, category, price, contact, post_time, isSelled, seller, imgName) values ("너구리 남는 제고 팝니다", "서령제하고 남은거 팔아요.", "korean", 1000, "010-0000-0000", "2024-03-27 09:04:30", 0, "guest", "1.jpg");
insert into item (title, content, category, price, contact, post_time, isSelled, seller, imgName) values ("블루투스 스피커요", "잘되긴하는데 중간에 끊겨요.", "korean", 1000, "010-0000-0000", "2024-03-27 09:04:30", 0, "guest", "2.jpg");
insert into item (title, content, category, price, contact, post_time, isSelled, seller, imgName) values ("서령고 ㅈㅈ", "이제 버려요.", "math", 1000, "010-0000-0000", "2024-03-27 09:04:30", 0, "guest", "3.jpg");
alter table item add file_type int;
alter table item add is_hidden tinyint DEFAULT 0;
alter table item add is_buyed tinyint DEFAULT 0;
alter table item add is_file tinyint DEFAULT 0;
update item set seller_num=1 and file_type=0 and is_buyed=0 and is_hidden=0;
update item set is_buyed=0 and is_hidden=0 and is_file=0;

create table alert(
    num int not null auto_increment, 
    listener_num int not null, 
    content text not null, 
    post_time datetime not null,
    isRead tinyint,
    link text not null,
    primary key(num)
);
insert into alert (listener_num, content, post_time, isRead, link) value (1, '이건 테스트입니다', '2024-03-29 7:37:00', 0, '/item/1');

create table comment(
    num int not null auto_increment, 
    to_num int not null,
    from_num int not null,
    from_uid text not null,
    reply_to int,
    content text not null, 
    post_time datetime not null,
    primary key(num)
);
insert into comment (to_num, from_num, from_uid , reply_to, content, post_time) value (1, 1, 'guest', null, '이건 테스트', '2024-04-08 8:19:00');

