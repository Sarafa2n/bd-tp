import { App } from './app/app';
import { UserView } from './view/user-view/user-view';
import { config } from './store/config';
import { ServiceView } from "./view/service-view/service-view";
import { ForumView } from "./view/forum-view/forum-view";
import { PostView } from "./view/post-view/post-view";
import { ThreadView } from "./view/thread-view/thread-view";

export const app = new App(config, 8090, 'localhost');

const userView = new UserView();
const serviceView = new ServiceView();
const forumView = new ForumView();
const postView = new PostView();
const threadView = new ThreadView();

app.setup();

userView.start();
serviceView.start();
forumView.start();
postView.start();
threadView.start();

app.start();
