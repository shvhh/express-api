import { AsyncLocalStorage } from 'async_hooks';
let asyncLocalStorage;
export const userContextMiddleware = async (req, res, next) => {
  asyncLocalStorage = new AsyncLocalStorage();
  asyncLocalStorage.run({ user: { _id: req.user._id } }, () => {
    next();
  });
};

export const getUserContext = () => {
  return asyncLocalStorage?.getStore()?.user;
};
