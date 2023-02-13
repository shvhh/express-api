import User from '../models/user.model';

//get all users
export const getAllUsers = async (query, limit, skip) => {
  // const data = await User.find(query);
  const data = await User.find(query).limit(limit).skip(skip);
  return data;
};

//create new user
export const newUser = async (body) => {
  const data = await User.create(body);
  return data;
};

//update single user
export const updateUser = async (query, body) => {
  const data = await User.findOneAndUpdate(query, body, {
    new: true
  });
  return data;
};

//delete single user
export const deleteUser = async (id) => {
  await User.findOneAndDelete(id);
  return '';
};

//get single user
export const getUser = async (id) => {
  const data = await User.findById(id);
  return data;
};
