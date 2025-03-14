/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { generateStarsInputs } from '../../../lib/functions';
import { useFilePreview } from '../../../lib/customHooks';
import addFileIMG from '../../../images/add_file.png';
import styles from './BookForm.module.css';
import { updateBook, addBook } from '../../../lib/common';

function BookForm({ book, validate }) {
  const userRating = book ? book.ratings.find((elt) => elt.userId === localStorage.getItem('userId'))?.grade : 0;

  const [rating, setRating] = useState(0);

  const navigate = useNavigate();
  const {
    register, watch, formState, handleSubmit, reset,
  } = useForm({
    defaultValues: useMemo(() => ({
      title: book?.title,
      author: book?.author,
      year: book?.year,
      genre: book?.genre,
    }), [book]),
  });
  useEffect(() => {
    reset(book);
  }, [book]);
  const file = watch(['file']);
  const [filePreview] = useFilePreview(file);

  useEffect(() => {
    setRating(userRating);
  }, [userRating]);

  useEffect(() => {
    if (!book && formState.dirtyFields.rating) {
      const rate = document.querySelector('input[name="rating"]:checked').value;
      setRating(parseInt(rate, 10));
      formState.dirtyFields.rating = false;
    }
  }, [formState]);

  const onSubmit = async (data) => {
    // Créer une copie de data pour ne pas modifier directement le paramètre
    const formData = { ...data };

    if (!book) {
      // Création d'un nouveau livre
      if (!formData.file || !formData.file[0]) {
        alert('Vous devez ajouter une image');
        return;
      }
      if (!formData.title || formData.title.trim() === '') {
        alert('Le titre est obligatoire');
        return;
      }
      if (!formData.author || formData.author.trim() === '') {
        alert("Le nom de l'auteur.rice est obligatoire");
        return;
      }
      if (!formData.genre || formData.genre.trim() === '') {
        alert('Le genre est obligatoire');
        return;
      }
      if (!formData.year || Number.isNaN(formData.year)) {
        alert("L'année de publication est obligatoire et doit être un nombre");
        return;
      }
      if (formData.rating === undefined || formData.rating === null) {
        formData.rating = 0;
      }
      const newBook = await addBook(formData);
      if (!newBook.error) {
        validate(true);
      } else {
        alert(newBook.message);
      }
    } else {
      // Mise à jour d'un livre existant

      // On effectue des validations sur les champs obligatoires
      if (!formData.title || formData.title.trim() === '') {
        alert('Le titre est obligatoire');
        return;
      }
      if (!formData.author || formData.author.trim() === '') {
        alert("Le nom de l'auteur.rice est obligatoire");
        return;
      }
      if (!formData.genre || formData.genre.trim() === '') {
        alert('Le genre est obligatoire');
        return;
      }
      if (!formData.year || Number.isNaN(formData.year)) {
        alert("L'année de publication est obligatoire et doit être un nombre");
        return;
      }
      // Pour la modification, l'image est optionnelle :
      // Si un fichier est fourni, il sera traité dans updateBook (via votre logique backend)
      // Sinon, l'URL existante restera en place

      const updatedBook = await updateBook(formData, formData.id);
      if (!updatedBook.error) {
        navigate('/');
      } else {
        alert(updatedBook.message);
      }
    }
  };

  const readOnlyStars = !!book;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.Form}>
      <input type="hidden" id="id" {...register('id')} />
      <label htmlFor="title">
        <p>Titre du livre</p>
        <input type="text" id="title" {...register('title')} />
      </label>
      <label htmlFor="author">
        <p>Auteur</p>
        <input type="text" id="author" {...register('author')} />
      </label>
      <label htmlFor="year">
        <p>Année de publication</p>
        <input type="text" id="year" {...register('year')} />
      </label>
      <label htmlFor="genre">
        <p>Genre</p>
        <input type="text" id="genre" {...register('genre')} />
      </label>
      <label htmlFor="rate">
        <p>Note</p>
        <div className={styles.Stars}>
          {generateStarsInputs(rating, register, readOnlyStars)}
        </div>
      </label>
      <label htmlFor="file">
        <p>Visuel</p>
        <div className={styles.AddImage}>
          {filePreview || book?.imageUrl ? (
            <>
              <img src={filePreview ?? book?.imageUrl} alt="preview" />
              <p>Modifier</p>
            </>
          ) : (
            <>
              <img src={addFileIMG} alt="Add file" />
              <p>Ajouter une image</p>
            </>
          )}

        </div>
        <input {...register('file')} type="file" id="file" />
      </label>
      <button type="submit">Publier</button>
    </form>
  );
}

BookForm.propTypes = {
  book: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    userId: PropTypes.string,
    title: PropTypes.string,
    author: PropTypes.string,
    year: PropTypes.number,
    imageUrl: PropTypes.string,
    genre: PropTypes.string,
    ratings: PropTypes.arrayOf(PropTypes.shape({
      userId: PropTypes.string,
      grade: PropTypes.number,
    })),
    averageRating: PropTypes.number,
  }),
  validate: PropTypes.func,
};

BookForm.defaultProps = {
  book: null,
  validate: null,
};
export default BookForm;
