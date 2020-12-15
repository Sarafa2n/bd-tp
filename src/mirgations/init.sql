\c project_db

CREATE EXTENSION IF NOT EXISTS citext;

DROP TABLE IF EXISTS forum, users, thread, post, vote;
DROP FUNCTION IF EXISTS post_path();
DROP FUNCTION IF EXISTS thread_count();
DROP FUNCTION IF EXISTS add_vote();
DROP FUNCTION IF EXISTS update_vote();
DROP FUNCTION IF EXISTS posts_count();

create table users (
    id SERIAL not null primary key,
    nickname CITEXT not null unique,
    email CITEXT not null unique,
    fullname varchar(255) not null,
    about TEXT
);

create table forum (
    id serial not null primary key,
    title varchar(255) not null,
    slug citext not null,
    userId integer not null references users,
    posts integer default 0 not null,
    threads integer default 0 not null,
    nickname CITEXT
);

create table thread (
    id serial not null primary key,
    title varchar(255) not null,
    message text not null,
    slug citext,

    userId integer not null references users,
    forumId integer not null references forum,
    votes integer default 0 not null,

    created timestamp with time zone default now() not null,

    forumSlug citext,
    nickname citext
);

create table post (
    id serial not null primary key,
    userId integer not null references users,
    parentId integer default 0,
    threadId integer not null references thread,

    isEdited boolean default false not null,
    message text,
    created  timestamp with time zone,

    author citext,
    threadSlug citext,
    forumSlug citext,
    path bigint []
);

create table vote (
    nickname citext not null references users (nickname),
    threadId integer not null constraint votes_thread_id_fk references thread,
    voice integer not null,
    constraint votes_userId_threadId_pk unique (nickname, threadId)
);


create unique index forum_id_uindex
  ON forum (id);

create unique index forums_slug_uindex
  ON forum (slug);

create unique index user_email_uindex
  ON users (email);

create unique index users_nickname_uindex
  ON users (nickname);

create unique index user_id_uindex
  ON users (id);

create unique index thread_id_uindex
  ON thread (id);


create index thread_created_index
  ON thread (created);


create unique index post_id_uindex
  ON post (id);


create function post_path() returns trigger
language plpgsql as $$ declare newpath bigint[];
begin
    if (new.parentId = 0) then
        new.path = newpath || new.id :: bigint;
        return new;
    end if;

    newpath = (select path from post where id = new.parentId and threadId = new.threadId);

    if (cardinality(newpath) > 0) then
        new.path = newpath || new.id :: bigint;
        return new;
    end if;

    raise invalid_foreign_key;
end
$$;

create trigger trigger_post_path before insert on post for each row execute procedure post_path();

create function thread_count() returns trigger
language plpgsql as $$
begin
    update forum set threads = threads + 1 where id = new.forumid;
    return new;
end
$$;

create trigger trigger_forum_thread after insert on thread for each row execute procedure  thread_count();

create function posts_count() returns trigger
language plpgsql as $$
begin
    update forum set posts = posts + 1 where slug = new.forumslug;
    return new;
end
$$;

create trigger trigger_forum_posts after insert on post for each row execute procedure  posts_count();

create function add_vote() returns trigger
language plpgsql as $$
begin
    update thread set votes = thread.votes + new.voice where id = new.threadid;
    return new;
end
$$;

create trigger trigger_add_vote after insert on vote for each row execute procedure add_vote();

create function update_vote() returns trigger
language plpgsql as $$
begin
    update thread set votes = thread.votes + (new.voice - old.voice) where id = new.threadid;
    return new;
end
$$;

create  trigger trigget_update_vote after update on vote for each row execute procedure update_vote();
