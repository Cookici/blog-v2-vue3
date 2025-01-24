import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/articles',
    name: 'ArticleList',
    component: () => import('@/views/ArticleList.vue')
  },
  {
    path: '/article/edit',
    name: 'ArticleEdit',
    component: () => import('@/views/ArticleEdit.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('@/views/ArticleDetail.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/my-articles',
    name: 'MyArticles',
    component: () => import('@/views/MyArticles.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/my-comments',
    name: 'MyComments',
    component: () => import('@/views/MyComments.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/Chat.vue'),
    meta: {
      requiresAuth: true
    }
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});


export default router;