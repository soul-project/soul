import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class UserNotFoundException extends GenericException {
  constructor({ id, email }: { id?: number; email?: string }) {
    super(
      {
        message: id
          ? `A user with the id: ${id} could not be found, please try again.`
          : `A user with the email: ${email} could not be found, please try again.`,
        error: 'USER_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
