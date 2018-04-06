/*eslint-disable */
$(document).ready(function() {
    $('select').formSelect();
    $(".dropdown-trigger").dropdown();
    $('.sidenav').sidenav();
    $('.chips-placeholder').chips({
        placeholder: 'Enter a tag',
        secondaryPlaceholder: '+Tag',
        limit: 4
    });
    $('.modal').modal();
    $('.tooltipped').tooltip();

    // Dynamic confirmation modal
    let elem = document.querySelector('#confirmation');
    M.Modal.init(elem);
    let confirmationModal = M.Modal.getInstance(elem);
    confirmationModal.options.onOpenStart = function(e) {
      const btn = confirmationModal._openingTrigger;
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      switch (action) {
        case 'delete':
          $('p#warning').text('This action can not be reversed. If you delete this service, it will be removed from this website but not from STEEM Blockchain');
          $('button#actionBtn').toggleClass('red').text('Delete');
        break;

        case 'pause':
          $('p#warning').text('If you pause this service you won\'t be able to take orders but you can always resume this service.');
          $('button#actionBtn').toggleClass('light-blue').text('Pause');
        break;

        case 'resume':
          $('p#warning').text('If you resume this service you will be able to receive orders.');
          $('button#actionBtn').toggleClass('light-blue').text('Resume');
        break;
      }

      $('#confirmation input[name=action]').val(action);
      $('#confirmation input[name=id]').val(id);
    }
    confirmationModal.options.onCloseStart = function(e) {
      $('p#warning').text('');
      $('button#actionBtn').removeClass('red').removeClass('light-blue');
      $('#confirmation input[name=action]').val('');
      $('#confirmation input[name=id]').val('');
    }

    // Dynamic confirmation modal
    let elemOm = document.querySelector('#orderManagement');
    M.Modal.init(elemOm);
    let omModal = M.Modal.getInstance(elemOm);
    omModal.options.onOpenStart = function(e) {
      const btn = omModal._openingTrigger;
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      switch (action) {
        case 'accept':
          $('p#warningOm').text('After accepting you will be able to deliver the order and get paid.');
          $('button#actionBtnOm').toggleClass('green').text('Accept');
        break;

        case 'decline':
          $('p#warningOm').text('If you decline, the order will be deleted, buyer will be refunded.');
          $('button#actionBtnOm').toggleClass('red').text('Decline');
        break;

        case 'dispute':
          $('p#warningOm').text('If you dispute this, agent will step in and do the arbitration.');
          $('button#actionBtnOm').toggleClass('red').text('Dispute');
        break;

        case 'deliver':
          $('p#warningOm').text('You are delivering the order to buyer. If buyer accepts, you\'ll receive payment right away.');
          $('#orderManagement .input-field').hide();
          $('#orderManagement input[name=wif]').attr('required', false);
          $('button#actionBtnOm').toggleClass('green').text('Deliver');
        break;

        case 'request_modification':
          $('p#warningOm').text('You are about to request modification on the order. ');
          $('#orderManagement .input-field').hide();
          $('#orderManagement input[name=wif]').attr('required', false);
          $('button#actionBtnOm').toggleClass('amber').text('Request Modification');
        break;
      }

      $('#orderManagement input[name=action]').val(action);
      $('#orderManagement input[name=orderId]').val(id);
    }
    omModal.options.onCloseStart = function(e) {
      $('p#warningOm').text('');
      $('#orderManagement .input-field').show();
      $('button#actionBtnOm').removeClass('red').removeClass('green').removeClass('amber');
      $('#orderManagement input[name=action]').val('');
      $('#orderManagement input[name=orderId]').val('');
      $('#orderManagement input[name=wif]').val('');
    }
});
