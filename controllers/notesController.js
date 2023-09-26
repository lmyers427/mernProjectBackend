//Test Routes with Thunderclient
const Note = require('../models/Note')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')


//Get all Notes
//route GET /notes
//eventually access will be specific to user or available to Admin
const getAllNotes = asyncHandler(async (req, res) => {
        const notes = await Note.find().lean()
        if (!notes?.length){
            return res.status(400).json({message: 'No notes found'})
        }
        //Adding the username with each note
        const notesWithUser = await Promise.all(notes.map(async (note) => {
            const user = await User.findById(note.user).lean().exec()
            return {...note, username: user.username }
         }))

         res.json(notesWithUser)

})

//POST Create note
//route POST /note
//eventually access will be Private
const createNewNote = asyncHandler(async (req, res) => {
    const {user, title, text } = req.body

    console.log(user);

    //Confirm data
    if (!user || !title || !text ){
        return res.status(400).json({message: 'All fields are required'})
    } 



    //Check for duplicate title
    const duplicate = await Note.findOne({title}).lean().exec()

    if(duplicate) {

        return res.status(409).json({message: 'Duplicate note title'})
    }

    
    //Create and store new note
    const newNote = new Note()

    newNote.user = user
    newNote.title = title
    newNote.text = text

    const result = await newNote.save()

    
   if(result) {//created
       return res.status(201).json({message: `New note created`})

    } else{
        
        return res.status(400).json({message: 'Invalid data received'})
    }
})

//PATCH Update user
//route PATCH /users
//@access Private
const updateNote = asyncHandler(async (req, res) => {
    const {id, title, user, text, completed } = req.body

    //Confirm data
    if(!id || !title || !user || !text || typeof completed !== 'boolean'
    ) {
        return res.status(400).json({ message: 'All fields are required'})
    }

    //confirm note exists to update
    const note = await Note.findById(id).exec()

    if(!note) {
        return res.status(400).json({ message : 'Note not found'})
    }

    //Check for duplicate title
    const duplicate = await Note.findOne({title}).lean().exec()

    //If note is renamed check to make sure title is not a duplicate
    if(duplicate && duplicate?._id.toString() !== id) {

        return res.status(409).json({message: 'Duplicate note title'})
    }


    note.title = title
    note.text = text
    note.user = user
    note.completed = completed


    const updatedNote = await note.save()

    res.json(`${updatedNote.title} updated`)
})

//DELETE delete user
//route DELETE /users
//@access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    //Confirm data
    if (!id){
        return res.status(400).json({message:'Note ID required'})


    }

    //Check note exists 
    const note = await Note.findById(id).exec()

    if(!note) {
        return res.status(400).json({message: 'No Note found to delete'})
    }
    

    const result = await note.deleteOne()

    const reply =  `Note ${result.title} with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}