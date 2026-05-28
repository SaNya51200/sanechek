package com.example.notesapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.notesapp.data.NoteDatabase
import com.example.notesapp.data.NoteRepository
import com.example.notesapp.ui.AddEditNoteScreen
import com.example.notesapp.ui.NotesScreen
import com.example.notesapp.ui.NotesViewModel
import com.example.notesapp.ui.NotesViewModelFactory
import com.example.notesapp.ui.theme.NotesAppTheme

class MainActivity : ComponentActivity() {
    
    private lateinit var noteRepository: NoteRepository
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val database = NoteDatabase.getDatabase(this)
        noteRepository = NoteRepository(database.noteDao())
        
        setContent {
            NotesAppTheme {
                NotesApp(noteRepository)
            }
        }
    }
}

@Composable
fun NotesApp(noteRepository: NoteRepository) {
    val navController = rememberNavController()
    
    // We create the ViewModel here to pass it to both screens, ensuring state is preserved
    val viewModel: NotesViewModel = viewModel(
        factory = NotesViewModelFactory(noteRepository)
    )

    NavHost(
        navController = navController,
        startDestination = "notes_list"
    ) {
        composable("notes_list") {
            NotesScreen(
                viewModel = viewModel,
                onNoteClick = { noteId ->
                    navController.navigate("add_edit_note/$noteId")
                },
                onAddClick = {
                    navController.navigate("add_edit_note")
                }
            )
        }
        
        composable("add_edit_note") {
            AddEditNoteScreen(
                onSaveClick = { title, content ->
                    viewModel.addNote(title, content)
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable("add_edit_note/{noteId}") { backStackEntry ->
            val noteId = backStackEntry.arguments?.getString("noteId")?.toInt() ?: 0
            
            // Load note data when screen opens
            LaunchedEffect(noteId) {
                viewModel.loadNoteById(noteId)
            }
            
            val currentNote by viewModel.currentNote.collectAsState()
            
            // Only show screen if note is loaded or if it's new
            if (currentNote != null && currentNote?.id == noteId) {
                AddEditNoteScreen(
                    initialTitle = currentNote!!.title,
                    initialContent = currentNote!!.content,
                    onSaveClick = { title, content ->
                        viewModel.updateNote(noteId, title, content)
                    },
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            } else {
                // Loading state could be here
            }
        }
    }
}
