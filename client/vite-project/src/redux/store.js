import { configureStore } from '@reduxjs/toolkit';
import postReducers from './postSlice'


export const store = configureStore({
    reducer :{
        posts : postReducers
    }
});