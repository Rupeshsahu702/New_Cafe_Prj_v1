// admin/src/pages/List/List.jsx
import React, { useEffect, useState } from 'react'
import './List.css'
import { url } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const List = () => {
  const [list, setList] = useState([])

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`)
    if (response.data.success) {
      setList(response.data.data)
    } else {
      toast.error("Failed to fetch list")
    }
  }

  const removeItem = async (id) => {
    const response = await axios.post(`${url}/api/food/remove`, { id })
    if (response.data.success) {
      toast.success(response.data.message)
      setList(prev => prev.filter(i => i._id !== id))
    } else {
      toast.error(response.data.message)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <div className='list add'>
      <div className="list-table">
        <div className="list-head">
          <div>Name</div>
          <div>Category</div>
          <div>Price</div>
          <div>Action</div>
        </div>
        {list.map((item) => (
          <div className="list-row" key={item._id}>
            <div className="name">{item.name}</div>
            <div>{item.category}</div>
            <div>₹{item.price}</div>
            <div>
              <button className="danger" onClick={() => removeItem(item._id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default List
