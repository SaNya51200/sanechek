package com.example.notesapp.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.notesapp.data.Note
import com.example.notesapp.data.NoteRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class NotesViewModel(
    private val repository: NoteRepository
) : ViewModel() {
    
    private val _notes = MutableStateFlow<List<Note>>(emptyList())
    val notes: StateFlow<List<Note>> = _notes.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _currentNote = MutableStateFlow<Note?>(null)
    val currentNote: StateFlow<Note?> = _currentNote.asStateFlow()
    
    init {
        loadNotes()
    }
    
    private fun loadNotes() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                repository.allNotes.collect { notesList ->
                    _notes.value = notesList
                }
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun addNote(title: String, content: String) {
        viewModelScope.launch {
            val note = Note(
                title = title,
                content = content,
                createdAt = System.currentTimeMillis()
            )
            repository.insertNote(note)
        }
    }
    
    fun updateNote(id: Int, title: String, content: String) {
        viewModelScope.launch {
            val noteToUpdate = repository.getNoteById(id)
            if (noteToUpdate != null) {
                val updatedNote = noteToUpdate.copy(title = title, content = content)
                repository.updateNote(updatedNote)
            }
        }
    }
    
    fun deleteNote(note: Note) {
        viewModelScope.launch {
            repository.deleteNote(note)
        }
    }

    fun loadNoteById(id: Int) {
        viewModelScope.launch {
            val note = repository.getNoteById(id)
            _currentNote.value = note
        }
    }
}
