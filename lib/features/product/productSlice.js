import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchProducts = createAsyncThunk('product/fetchProducts', 
    async (params = {}, thunkAPI) => {
        try {
            const searchParams = new URLSearchParams()
            Object.entries(params || {}).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return
                searchParams.set(key, String(value))
            })

            const queryString = searchParams.toString()
            const { data } = await axios.get(`/api/products${queryString ? `?${queryString}` : ''}`)
            return data.products
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data)
        }
    }
)

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload
        },
        clearProduct: (state) => {
            state.list = []
        }
    },
    extraReducers: (builder)=>{
        builder.addCase(fetchProducts.fulfilled, (state, action)=>{
            state.list = action.payload
        })
    }
})

export const { setProduct, clearProduct } = productSlice.actions

export default productSlice.reducer