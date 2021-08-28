import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // console.log(cart)
  
  const addProduct = async (productId: number) => {
    try {
      const stockRes = await api.get(`stock/${productId}`)
      const stock:Stock = stockRes.data

      const chosenProduct = cart.filter(product => product.id === productId)
      if (chosenProduct[0]) {
        const newCart = cart.map(product => {
          if (product.id === productId) {
            const isAvailable = stock.amount > product.amount
            if (isAvailable){
              product.amount = product.amount + 1
              return product
            } else throw new Error('Product out of stock')
          }
          return product
        })
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          setCart(newCart)        
      } else {
        const res = await api.get(`products/${productId}`)
        const newProduct = res.data
        newProduct.amount = 1
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]))
        setCart([...cart, newProduct])
      }

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart)
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    const res = await api.get(`/stock/${productId}`)
    const isAvailable = res.data.amount >= amount
    const newCart = cart.map(product => {
      if (product.id === productId) {
        if(isAvailable){
          return {...product, amount: amount}
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return product
        }
      } else {
        return product
      }
    })
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart)
    }
    

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}


export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
